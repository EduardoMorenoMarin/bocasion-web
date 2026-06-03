package com.proyecto.capstone.activities.admin.fragments;

import android.app.AlertDialog;
import android.graphics.Typeface;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.AdapterView;
import android.widget.ArrayAdapter;
import android.widget.LinearLayout;
import android.widget.Spinner;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.google.android.material.button.MaterialButton;
import com.google.android.material.card.MaterialCardView;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.database.ValueEventListener;
import com.proyecto.capstone.R;
import com.proyecto.capstone.adapters.SalesAdapter;
import com.proyecto.capstone.models.Item;
import com.proyecto.capstone.models.Order;
import com.proyecto.capstone.models.Review;
import com.proyecto.capstone.models.Sales;
import com.proyecto.capstone.models.User;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

public class SalesFragment extends Fragment {

    private TextView txtTotalSales, txtTotalOrders;
    private MaterialCardView btnAnalytics;
    private RecyclerView rvSales;
    private Spinner spinnerFilter;
    private SalesAdapter adapter;
    private List<Sales> salesList = new ArrayList<>();
    private List<Order> allOrdersList = new ArrayList<>();
    private Map<String, User> cookMap = new HashMap<>();
    private Map<String, Review> reviewMap = new HashMap<>();
    private Map<String, Item> itemMap = new HashMap<>();

    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_sales, container, false);

        txtTotalSales = view.findViewById(R.id.txt_total_sales);
        txtTotalOrders = view.findViewById(R.id.txt_total_orders);
        btnAnalytics = view.findViewById(R.id.btn_analytics);
        rvSales = view.findViewById(R.id.rv_sales);
        spinnerFilter = view.findViewById(R.id.spinner_sales_filter);

        rvSales.setLayoutManager(new LinearLayoutManager(getContext()));
        adapter = new SalesAdapter(salesList, this::showSalesDetailsDialog);
        rvSales.setAdapter(adapter);

        setupSpinner();
        loadInitialData();

        btnAnalytics.setOnClickListener(v -> showAnalyticsDialog());

        return view;
    }

    private void setupSpinner() {
        String[] options = {"Ventas por Cocinero", "Productos más Vendidos"};
        ArrayAdapter<String> spinnerAdapter = new ArrayAdapter<>(requireContext(), android.R.layout.simple_spinner_item, options);
        spinnerAdapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        spinnerFilter.setAdapter(spinnerAdapter);

        spinnerFilter.setOnItemSelectedListener(new AdapterView.OnItemSelectedListener() {
            @Override
            public void onItemSelected(AdapterView<?> parent, View view, int position, long id) {
                processAndDisplayData();
            }

            @Override
            public void onNothingSelected(AdapterView<?> parent) {}
        });
    }

    private void loadInitialData() {
        FirebaseDatabase.getInstance().getReference("users").addListenerForSingleValueEvent(new ValueEventListener() {
            @Override
            public void onDataChange(@NonNull DataSnapshot snapshot) {
                cookMap.clear();
                for (DataSnapshot child : snapshot.getChildren()) {
                    User user = child.getValue(User.class);
                    if (user != null && "cocinero".equalsIgnoreCase(user.getRole())) {
                        cookMap.put(child.getKey(), user);
                    }
                }
                loadItemsData();
            }

            @Override
            public void onCancelled(@NonNull DatabaseError error) {}
        });
    }

    private void loadItemsData() {
        FirebaseDatabase.getInstance().getReference("items").addListenerForSingleValueEvent(new ValueEventListener() {
            @Override
            public void onDataChange(@NonNull DataSnapshot snapshot) {
                itemMap.clear();
                for (DataSnapshot child : snapshot.getChildren()) {
                    Item item = child.getValue(Item.class);
                    if (item != null) {
                        itemMap.put(child.getKey(), item);
                    }
                }
                loadReviewsData();
            }

            @Override
            public void onCancelled(@NonNull DatabaseError error) {}
        });
    }

    private void loadReviewsData() {
        FirebaseDatabase.getInstance().getReference("reviews").addValueEventListener(new ValueEventListener() {
            @Override
            public void onDataChange(@NonNull DataSnapshot snapshot) {
                reviewMap.clear();
                for (DataSnapshot child : snapshot.getChildren()) {
                    Review review = child.getValue(Review.class);
                    if (review != null) {
                        reviewMap.put(child.getKey(), review);
                    }
                }
                loadOrdersData();
            }

            @Override
            public void onCancelled(@NonNull DatabaseError error) {}
        });
    }

    private void loadOrdersData() {
        FirebaseDatabase.getInstance().getReference("orders").addValueEventListener(new ValueEventListener() {
            @Override
            public void onDataChange(@NonNull DataSnapshot snapshot) {
                allOrdersList.clear();
                double totalSalesValue = 0;
                int validOrdersCount = 0;

                for (DataSnapshot child : snapshot.getChildren()) {
                    Order order = child.getValue(Order.class);
                    if (order != null) {
                        String status = order.getStatus() != null ? order.getStatus().toLowerCase() : "";
                        if ("cancelled".equals(status) || "cancelado".equals(status)) {
                            continue;
                        }
                        allOrdersList.add(order);
                        totalSalesValue += order.getTotalPrice();
                        validOrdersCount++;
                    }
                }

                txtTotalSales.setText(String.format(Locale.getDefault(), "S/. %.2Fi", totalSalesValue));
                txtTotalOrders.setText(String.valueOf(validOrdersCount));

                processAndDisplayData();
            }

            @Override
            public void onCancelled(@NonNull DatabaseError error) {
                Toast.makeText(getContext(), "Error al cargar pedidos", Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void processAndDisplayData() {
        salesList.clear();
        int selectedPosition = spinnerFilter.getSelectedItemPosition();

        if (selectedPosition == 0) {
            Map<String, Integer> cookOrderCount = new HashMap<>();
            for (Order order : allOrdersList) {
                String cookId = order.getCookId();
                if (cookId != null && !cookId.isEmpty()) {
                    cookOrderCount.put(cookId, cookOrderCount.getOrDefault(cookId, 0) + 1);
                }
            }
            for (Map.Entry<String, User> entry : cookMap.entrySet()) {
                String cookId = entry.getKey();
                String cookName = entry.getValue().getName();
                int count = cookOrderCount.getOrDefault(cookId, 0);
                salesList.add(new SalesCountWithCook(cookId, cookName, count));
            }
        } else if (selectedPosition == 1) {
            Map<String, Integer> itemQuantities = new HashMap<>();
            for (Order order : allOrdersList) {
                if (order.getItems() != null) {
                    for (Order.OrderItem orderItem : order.getItems()) {
                        String itemId = orderItem.getItemId();
                        if (itemId != null) {
                            itemQuantities.put(itemId, itemQuantities.getOrDefault(itemId, 0) + orderItem.getQuantity());
                        }
                    }
                }
            }
            List<SalesItemQuantity> tempProductList = new ArrayList<>();
            for (Map.Entry<String, Item> entry : itemMap.entrySet()) {
                String itemId = entry.getKey();
                String itemName = entry.getValue().getName();
                int totalQty = itemQuantities.getOrDefault(itemId, 0);
                tempProductList.add(new SalesItemQuantity(itemId, itemName, totalQty));
            }
            Collections.sort(tempProductList, (o1, o2) -> Integer.compare(o2.getQuantitySold(), o1.getQuantitySold()));
            salesList.addAll(tempProductList);
        }

        adapter.notifyDataSetChanged();
    }

    public static class SalesCountWithCook extends Sales {
        private String cookId;
        private String cookName;
        private int orderCount;

        public SalesCountWithCook(String cookId, String cookName, int orderCount) {
            super(0);
            this.cookId = cookId;
            this.cookName = cookName;
            this.orderCount = orderCount;
        }

        public String getCookId() { return cookId; }
        public String getCookName() { return cookName; }
        public int getOrderCount() { return orderCount; }
    }

    public static class SalesItemQuantity extends Sales {
        private String itemId;
        private String itemName;
        private int quantitySold;

        public SalesItemQuantity(String itemId, String itemName, int quantitySold) {
            super(0);
            this.itemId = itemId;
            this.itemName = itemName;
            this.quantitySold = quantitySold;
        }

        public String getItemId() { return itemId; }
        public String getItemName() { return itemName; }
        public int getQuantitySold() { return quantitySold; }
    }

    private void showSalesDetailsDialog(Sales salesItem) {
        View dialogView = LayoutInflater.from(getContext()).inflate(R.layout.dialog_sales_details, null);
        TextView titleText = dialogView.findViewById(R.id.dialog_title);
        LinearLayout container = dialogView.findViewById(R.id.orders_container);
        MaterialButton btnClose = dialogView.findViewById(R.id.btn_close_dialog);

        if (salesItem instanceof SalesCountWithCook) {
            SalesCountWithCook cookSales = (SalesCountWithCook) salesItem;
            titleText.setText("Pedidos de: " + cookSales.getCookName());

            for (Order order : allOrdersList) {
                if (cookSales.getCookId().equals(order.getCookId())) {
                    TextView orderInfo = new TextView(getContext());
                    orderInfo.setText(String.format(Locale.getDefault(), "Pedido: #%s\nCliente: %s\nTotal: S/. %.2f\nEstado: %s\n",
                            order.getOrderCode(), order.getUserName(), order.getTotalPrice(), order.getStatus()));
                    orderInfo.setTextColor(getResources().getColor(android.R.color.white));
                    orderInfo.setTextSize(14);
                    orderInfo.setTypeface(null, Typeface.BOLD);
                    orderInfo.setPadding(0, 10, 0, 10);
                    container.addView(orderInfo);
                }
            }
        } else if (salesItem instanceof SalesItemQuantity) {
            SalesItemQuantity productSales = (SalesItemQuantity) salesItem;
            titleText.setText("Ventas de: " + productSales.getItemName());

            TextView summaryText = new TextView(getContext());
            summaryText.setText(String.format(Locale.getDefault(), "Total unidades vendidas: %d\n", productSales.getQuantitySold()));
            summaryText.setTextColor(getResources().getColor(android.R.color.white));
            summaryText.setTextSize(16);
            summaryText.setTypeface(null, Typeface.BOLD_ITALIC);
            summaryText.setPadding(0, 10, 0, 20);
            container.addView(summaryText);

            for (Order order : allOrdersList) {
                if (order.getItems() != null) {
                    for (Order.OrderItem oi : order.getItems()) {
                        if (productSales.getItemId().equals(oi.getItemId())) {
                            TextView orderInfo = new TextView(getContext());
                            orderInfo.setText(String.format(Locale.getDefault(), "Pedido: #%s\nCliente: %s\nCantidad en este pedido: %d\n",
                                    order.getOrderCode(), order.getUserName(), oi.getQuantity()));
                            orderInfo.setTextColor(getResources().getColor(android.R.color.white));
                            orderInfo.setTextSize(14);
                            orderInfo.setPadding(0, 5, 0, 5);
                            container.addView(orderInfo);
                        }
                    }
                }
            }
        }

        AlertDialog dialog = new AlertDialog.Builder(requireContext())
                .setView(dialogView)
                .create();

        if (dialog.getWindow() != null) {
            dialog.getWindow().setBackgroundDrawableResource(android.R.color.transparent);
        }

        btnClose.setOnClickListener(v -> dialog.dismiss());
        dialog.show();
    }

    private void showAnalyticsDialog() {
        View view = LayoutInflater.from(getContext()).inflate(R.layout.dialog_review_analytics, null);
        TextView weekly = view.findViewById(R.id.txt_weekly);
        TextView monthly = view.findViewById(R.id.txt_monthly);
        TextView ai = view.findViewById(R.id.txt_ai_analysis);

        int positive = 0;
        int negative = 0;
        StringBuilder comments = new StringBuilder();

        for (Review review : reviewMap.values()) {
            if (review.getRating() >= 4) positive++;
            else negative++;

            if (review.getComment() != null && !review.getComment().trim().isEmpty()) {
                comments.append("• ").append(review.getComment()).append("\n\n");
            }
        }

        weekly.setText("📅 Semana\n\nClientes satisfechos: " + positive);
        monthly.setText("📆 Mes\n\nClientes insatisfechos: " + negative);
        ai.setText("🧠 Comentarios Analizados\n\n" + (comments.length() > 0 ? comments : "No hay comentarios disponibles."));

        new AlertDialog.Builder(requireContext())
                .setView(view)
                .show();
    }
}
